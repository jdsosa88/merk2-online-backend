import { Injectable } from "@nestjs/common";
import { ApiResponseDto } from "../dto/response.dto";
import { Role } from "src/modules/users/user.schema";

@Injectable()
export class SwaggerResponseUtils {
  getExampleResponseWithUser(message?: string, role: string = Role.CUSTOMER, isActive: boolean = false) {
    const exampleUser: Object = {
      firstName: "User",
      lastName: "Example",
      email: "user.example@email.com",
      phone: "+5351657628",
      isActive,
      role: role,
      _id: "68bec9fdb83564195e6aa63d",
      createdAt: "2025-09-08T12:20:13.346Z",
      updatedAt: "2025-09-08T12:20:13.346Z",
      __v: 0
    };
    if (message) {
      return new ApiResponseDto(message, exampleUser);
    } else {
      return new ApiResponseDto(exampleUser);
    }
  }

  getResponseWithUsersList() {
    const listData: Object = {
      items: [       
        {
          _id: "68b97b7bf6c2528ac3e9063e",
          firstName: "Provider",
          lastName: "User",
          email: "provider@test.com",
          phone: "+1234567892",
          isActive: true,
          role: "PROVIDER",
          createdAt: "2025-09-04T11:43:55.294Z",
          updatedAt: "2025-09-04T11:43:55.294Z",
          __v: 0
        },
        {
          _id: "68b97b7bf6c2528ac3e90641",
          firstName: "Messenger",
          lastName: "User",
          email: "messenger@test.com",
          phone: "+1234567893",
          isActive: true,
          role: "MESSENGER",
          createdAt: "2025-09-04T11:43:55.545Z",
          updatedAt: "2025-09-04T11:43:55.545Z",
          __v: 0
        },
      ],
      total: 12,
      page: 2,
      perPage: 10,
      totalPages: 2
    };

    return new ApiResponseDto(listData);
  }

  getResponseWithLoginResponse(message?: string, withUser: boolean = true) {
    const loginResponse: any = {};
    if (withUser) {
      loginResponse.user = {
        firstName: "User",
        lastName: "Example",
        email: "user.example@email.com",
        phone: "+5351657628",
        isActive: true,
        role: Role.CUSTOMER,
        _id: "68bec9fdb83564195e6aa63d",
        createdAt: "2025-09-08T12:20:13.346Z",
        updatedAt: "2025-09-08T12:20:13.346Z",
        __v: 0
      };
    }
    loginResponse.tokens = {
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGI5N2I3YWY2YzI1MjhhYzNlOTA2MzgiLCJpYXQiOjE3NTczNDQ5MDIsImV4cCI6MTc1Nzk0OTcwMn0.QZoMlIjJd7D-BnaGe5-nIYX7YCSFJPtFniIP-KQgcPc",
      refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGI5N2I3YWY2YzI1MjhhYzNlOTA2MzgiLCJpYXQiOjE3NTczNDQ5MDIsImV4cCI6MTc1OTkzNjkwMn0.TQ9p_uaeh59IQWEqZ1T9tUYZ76k626WojI18112L-H8"
    };
    return new ApiResponseDto(message, loginResponse);
  }
}