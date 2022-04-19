import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { query, Request, Response } from 'express';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';
import { UsersService } from './users.service';

//retourne le premier endpoint qui match la route
@Controller('users')
export class UsersController {
  constructor(private usersServices: UsersService) {}

  @Get('aCleanPlusTard')
  findAllTEST(
    @Req()
    request: Request,
    @Res()
    response: Response,
    @Query() query,
  ): any {
    console.log(request);
    return response.json({ msg: 'Find All in users' });
  }

  @Get()
  async findAll(@Param() params): Promise<User[]> {
    return this.usersServices.findAll();
  }

  @Get('docs') //ce bloc est juste un bloc demo a retirer
  @Redirect('https://docs.nestjs.com', 302)
  getDocs(@Query('version') version) {
    if (version && version === '5') {
      return { url: 'https://docs.nestjs.com/v5/' };
    }
  }

  //les param sont ceux du chemin de la requete
  @Get('/:id')
  async findOne(@Param() params): Promise<User> {
    return this.usersServices.findOne(params.id);
  }

  @Get('/friends')
  findFriend(): string {
    return 'Friends in users';
  }

  @Post()
  //   @HttpCode(204)
  //   @Header('Authorization', 'Bearer XAOIFUAOSijfoIJASF')
  async create(@Body() user: CreateUserDTO): Promise<User[]> {
    return this.usersServices.create(user);
  }

  @Put()
  update(): string {
    return 'Update stuff in users';
  }

  @Delete('/:id')
  async delete(@Param() params): Promise<User[]> {
    return this.usersServices.delete(params.id);
  }
}
