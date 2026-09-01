import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { DeliveryQuoteDto } from '../delivery/dto/delivery-quote.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignMessengerDto } from './dto/assign-messenger.dto';
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
import { Types } from 'mongoose';
import { CreateOrderPolicyHandler } from './policies/create-order.policy';
import { ListOrdersPolicyHandler } from './policies/list-orders.policy';
import { ReadOrderPolicyHandler } from './policies/read-order.policy';
import { UpdateOrderPolicyHandler } from './policies/update-order.policy';

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
}