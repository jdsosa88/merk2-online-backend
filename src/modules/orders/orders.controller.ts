import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { PosSaleDto } from './dto/pos-sale.dto';
import { PosDeliveryQuoteDto } from './dto/pos-delivery-quote.dto';
import { DeliveryQuoteDto } from '../delivery/dto/delivery-quote.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignMessengerDto } from './dto/assign-messenger.dto';
import { CreatePartialReturnDto } from './dto/create-partial-return.dto';
import { ConfirmDeliveryDto } from './dto/confirm-delivery.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { User } from '../users/schemas/user.schema';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { Order } from './schemas/order.schema';
import { CheckPolicies } from '../casl/decorators/policies.decorator';
import {
  ApiCheckout,
  ApiGetOrder,
  ApiListOrders,
  ApiUpdateOrderStatus,
  ApiAssignMessenger,
  ApiGetStoreOrders,
} from './decorators/swagger-orders.decorator';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { CreateOrderPolicyHandler } from './policies/create-order.policy';
import { ListOrdersPolicyHandler } from './policies/list-orders.policy';
import { ReadOrderPolicyHandler } from './policies/read-order.policy';
import { UpdateOrderPolicyHandler } from './policies/update-order.policy';
import { FileService } from 'src/common/services/file.service';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @CheckPolicies(new CreateOrderPolicyHandler())
  @ApiCheckout()
  async checkout(
    @AuthUser() user: User,
    @Body() checkoutOrderDto: CheckoutOrderDto,
  ): Promise<ApiResponseDto<Order[]>> {
    const orders = await this.ordersService.checkout(user, checkoutOrderDto);
    return new ApiResponseDto('Orders created successfully', orders);
  }

  @Post('pos-sale')
  @CheckPolicies(new CreateOrderPolicyHandler())
  @ApiOperation({
    summary: 'Register an in-store POS sale or phone order (optional delivery)',
  })
  async createPosSale(
    @AuthUser() user: User,
    @Body() posSaleDto: PosSaleDto,
  ): Promise<ApiResponseDto<Order>> {
    const order = await this.ordersService.createPosSale(user, posSaleDto);
    return new ApiResponseDto('In-store sale registered successfully', order);
  }

  @Post('pos-delivery-quote')
  @CheckPolicies(new CreateOrderPolicyHandler())
  @ApiOperation({ summary: 'Quote messaging fee for a POS phone order' })
  async quotePosDelivery(
    @AuthUser() user: User,
    @Body() dto: PosDeliveryQuoteDto,
  ): Promise<ApiResponseDto> {
    const quote = await this.ordersService.quotePosDelivery(user, dto);
    return new ApiResponseDto('POS delivery quote calculated', quote);
  }

  @Post('delivery-quote')
  @CheckPolicies(new CreateOrderPolicyHandler())
  @ApiOperation({ summary: 'Calcular costo de mensajería por tienda (carrito)' })
  async deliveryQuote(
    @AuthUser() user: User,
    @Body() dto: DeliveryQuoteDto,
  ): Promise<ApiResponseDto> {
    const quote = await this.ordersService.quoteDelivery(user, dto);
    return new ApiResponseDto('Delivery quote calculated', quote);
  }

  @Get('/list')
  @CheckPolicies(new ListOrdersPolicyHandler())
  @ApiListOrders()
  async findAll(
    @AuthUser() user: User,
    @Query() query: ListOrdersQueryDto,
  ): Promise<ApiResponseDto<PaginatedListDto<Order>>> {
    const paginatedList = await this.ordersService.findAllPaginated(query, user);
    return new ApiResponseDto('Orders retrieved successfully', paginatedList);
  }

  @Get('store')
  @CheckPolicies(new ListOrdersPolicyHandler())
  @ApiGetStoreOrders()
  async findStoreOrders(
    @AuthUser() user: User,
    @Query() query: ListOrdersQueryDto,
  ): Promise<ApiResponseDto<PaginatedListDto<Order>>> {
    const paginatedList = await this.ordersService.findOrdersByStore(query, user);
    return new ApiResponseDto('Store orders retrieved successfully', paginatedList);
  }

  @Get()
  @CheckPolicies(new ReadOrderPolicyHandler())
  @ApiGetOrder()
  async findOne(@Query('id') id: string, @AuthUser() user: User): Promise<ApiResponseDto<Order>> {
    const order = await this.ordersService.findOne(id, user);
    return new ApiResponseDto('Order retrieved successfully', order);
  }

  @Patch('status')
  @CheckPolicies(new UpdateOrderPolicyHandler())
  @HttpCode(HttpStatus.OK)
  @ApiUpdateOrderStatus()
  async updateStatus(
    @Query('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Order>> {
    const order = await this.ordersService.updateOrderStatus(id, updateOrderStatusDto, user);
    const message = `Order status updated to ${updateOrderStatusDto.status}`;
    return new ApiResponseDto(message, order);
  }

  @Patch('assign-messenger')
  @CheckPolicies(new UpdateOrderPolicyHandler())
  @HttpCode(HttpStatus.OK)
  @ApiAssignMessenger()
  async assignMessenger(    
    @Body() assignMessengerDto: AssignMessengerDto,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Order>> {
    const order = await this.ordersService.assignMessenger(assignMessengerDto, user);
    return new ApiResponseDto('Messenger assigned successfully', order);
  }

  @Post('returns')
  @CheckPolicies(new UpdateOrderPolicyHandler())
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Register a partial return during delivery (reduce qty / remove items with reason and optional evidence image)',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileInterceptor('evidence', {
      storage: FileService.getDiskStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: FileService.imageFileFilter,
    }),
  )
  async createPartialReturn(
    @Query('id') id: string,
    @Body() body: any,
    @UploadedFile() evidence: Express.Multer.File | undefined,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Order>> {
    const dto = this.parsePartialReturnBody(body);
    const order = await this.ordersService.createPartialReturn(id, dto, user, evidence);
    return new ApiResponseDto('Partial return registered', order);
  }

  @Post('confirm-delivery')
  @CheckPolicies(new UpdateOrderPolicyHandler())
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Confirm delivery by scanning the customer QR (marks order completed and registers the sale)',
  })
  async confirmDelivery(
    @Body() dto: ConfirmDeliveryDto,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Order>> {
    const order = await this.ordersService.confirmDeliveryByCode(user, dto);
    return new ApiResponseDto('Delivery confirmed via QR', order);
  }

  private parsePartialReturnBody(body: any): CreatePartialReturnDto {
    const itemsRaw = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
    return {
      items: itemsRaw,
      reason: body.reason,
      description: body.description,
      clientLocalId: body.clientLocalId,
    };
  }
}