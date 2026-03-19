import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { Body, Post } from '@nestjs/common';
import { CreateLogisticsEntryDto } from './dto/create-logistics-entry.dto';
import { Query } from '@nestjs/common';
import { LogisticsEntryFilterDto } from './dto/logistics-entry-filter.dto';
import { Res } from '@nestjs/common';
import express from 'express';
import * as ExcelJS from 'exceljs';
import { Put } from '@nestjs/common';
import { UpdateLogisticsEntryDto } from './dto/update-logistics-entry.dto';
import { CreateLogisticsClientMapDto } from './dto/create-logistics-client-map.dto';
import { LogisticsClientMapFilterDto } from './dto/logistics-client-map-filter.dto';

@Controller('logistics')

export class LogisticsController {
    
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('allLogistics')
  async getAllLogistics() {
    return this.logisticsService.getAllLogistics();
  }

  @Get('vials')
  async getAllVials() {
    return this.logisticsService.getAllVials();
  }

  @Get('clients')
  async getAllClients() {
    return this.logisticsService.getAllClients();
  }

  @Get(':id/clients')
  async getClientsByLogistics(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsService.getClientsByLogistics(id);
  }

  @Post('entry')
  async createLogisticsEntry(@Body() dto: CreateLogisticsEntryDto) {
    return this.logisticsService.createLogisticsEntry(dto);
  }

  @Post('client-map/delete/:id')
async deleteLogisticsClientMap(@Param('id', ParseIntPipe) id: number) {
  return this.logisticsService.deleteLogisticsClientMap(id);
}
@Get('client-map/list')
async getLogisticsClientMapList() {
  return this.logisticsService.getLogisticsClientMapList();
}

  @Post('client-map')
async createLogisticsClientMap(@Body() dto: CreateLogisticsClientMapDto) {
  return this.logisticsService.createLogisticsClientMap(dto);
}

@Post('entry/update/:id')
async updateLogisticsEntry(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateLogisticsEntryDto,
) {
  return this.logisticsService.updateLogisticsEntry(id, dto);
}

  @Get('entry/list')
async getLogisticsEntryList(@Query() query: LogisticsEntryFilterDto) {
  return this.logisticsService.getLogisticsEntryList(query);
}

@Get('entry/export')
async exportLogisticsEntry(
  @Query() query: LogisticsEntryFilterDto,
  @Res() res: express.Response,
) {
  const rows = await this.logisticsService.getLogisticsEntryExportData(query);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Logistics Entry');

  worksheet.columns = [
    { header: 'Entry ID', key: 'entry_id', width: 12 },
    { header: 'Entry Date', key: 'entry_date', width: 15 },
    { header: 'Submitted At', key: 'submitted_at', width: 24 },
    { header: 'Logistics ID', key: 'logistics_id', width: 12 },
    { header: 'Logistics Name', key: 'logistics_name', width: 24 },
    { header: 'Logistics Code', key: 'logistics_code', width: 18 },
    { header: 'Client ID', key: 'client_id', width: 12 },
    { header: 'Client Name', key: 'client_name', width: 28 },
    { header: 'Client Code', key: 'client_code', width: 18 },
    { header: 'Vial ID', key: 'vial_id', width: 10 },
    { header: 'Vial Name', key: 'vial_name', width: 18 },
    { header: 'Qty', key: 'qty', width: 10 },
  ];

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=logistics-entry.xlsx',
  );

  await workbook.xlsx.write(res);
  res.end();
}

@Get('entry/summary')
async getLogisticsEntrySummary(@Query() query: LogisticsEntryFilterDto) {
  return this.logisticsService.getLogisticsEntrySummary(query);
}

@Get('entry/:id')
async getLogisticsEntryById(@Param('id', ParseIntPipe) id: number) {
  return this.logisticsService.getLogisticsEntryById(id);
}

@Get('dashboard/counts')
async getDashboardCounts() {
  return this.logisticsService.getDashboardCounts();
}

@Get('entry-edit/:id')
async getLogisticsEntryForEdit(@Param('id', ParseIntPipe) id: number) {
  return this.logisticsService.getLogisticsEntryForEdit(id);
}
}