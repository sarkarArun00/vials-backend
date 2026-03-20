import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientMasterService } from './client-master.service';
import { CreateClientMasterDto } from 'src/dto/create-client-master.dto';
import { UpdateClientMasterDto } from './update-client-master.dto';

@Controller('client-master')
export class ClientMasterController {
  constructor(private readonly clientMasterService: ClientMasterService) {}

  @Post('create')
  create(@Body() createDto: CreateClientMasterDto) {
    return this.clientMasterService.create(createDto);
  }

  @Get('list')
  findAll() {
    return this.clientMasterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientMasterService.findOne(id);
  }

  @Patch('update/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateClientMasterDto,
  ) {
    return this.clientMasterService.update(id, updateDto);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientMasterService.remove(id);
  }
}