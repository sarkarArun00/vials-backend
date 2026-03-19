import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogisticsPerson } from './entities/logistics-person.entity';
import { LogisticsClientMap } from './entities/logistics-client-map.entity';
import { VialMaster } from './entities/vial-master.entity';

import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientMaster } from './entities/client-master.entity';
import { LogisticsEntry } from './entities/logistics-entry.entity';
import { LogisticsEntryDetail } from './entities/logistics-entry-detail.entity';
import { CreateLogisticsEntryDto } from './dto/create-logistics-entry.dto';
import { LogisticsEntryFilterDto } from './dto/logistics-entry-filter.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateLogisticsEntryDto } from './dto/update-logistics-entry.dto';
import { CreateLogisticsClientMapDto } from './dto/create-logistics-client-map.dto';
import { LogisticsClientMapFilterDto } from './dto/logistics-client-map-filter.dto';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(LogisticsPerson)
    private readonly logisticsPersonRepository: Repository<LogisticsPerson>,

    @InjectRepository(LogisticsClientMap)
    private readonly logisticsClientMapRepository: Repository<LogisticsClientMap>,

    @InjectRepository(VialMaster)
    private readonly vialMasterRepository: Repository<VialMaster>,

    @InjectRepository(LogisticsEntry)
    private readonly logisticsEntryRepository: Repository<LogisticsEntry>,

    @InjectRepository(LogisticsEntryDetail)
    private readonly logisticsEntryDetailRepository: Repository<LogisticsEntryDetail>,

    @InjectRepository(ClientMaster)
    private readonly clientMasterRepository: Repository<ClientMaster>,

    private readonly dataSource: DataSource,
  ) {}

  async getAllLogistics() {
    const data = await this.logisticsPersonRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });

    return {
      status: 1,
      message: 'Logistics list fetched successfully',
      data,
    };
  }

  async getAllClients() {
  const data = await this.clientMasterRepository.find({
    where: { is_active: true },
    order: { client_name: 'ASC' },
  });

  return {
    status: 1,
    message: 'Client list fetched successfully',
    data,
  };
}

  async getClientsByLogistics(logisticsId: number) {
    const data = await this.logisticsClientMapRepository.find({
      where: {
        logistics_id: { id: logisticsId },
      },
      relations: {
        client_id: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return {
      status: 1,
      message: 'Mapped clients fetched successfully',
      data: data.map((item) => item.client_id),
    };
  }

  async getAllVials() {
    const data = await this.vialMasterRepository.find({
      where: { is_active: true },
      order: { display_order: 'ASC' },
    });

    return {
      status: 1,
      message: 'Vial list fetched successfully',
      data,
    };
  }

async createLogisticsEntry(dto: CreateLogisticsEntryDto) {
  const today = new Date();
  const entryDateObj = new Date(dto.entryDate);

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const entryOnly = new Date(
    entryDateObj.getFullYear(),
    entryDateObj.getMonth(),
    entryDateObj.getDate(),
  );

  const existingEntry = await this.logisticsEntryRepository.findOne({
    where: {
      logistics_id: { id: dto.logisticsId },
      entry_date: dto.entryDate,
    },
  });

  if (existingEntry) {
    throw new BadRequestException(
      'Entry already submitted for this logistics person on selected date',
    );
  }

  if (entryOnly > todayOnly) {
    throw new BadRequestException('Future date is not allowed');
  }

  const logistics = await this.logisticsPersonRepository.findOne({
    where: {
      id: dto.logisticsId,
      is_active: true,
    },
  });

  if (!logistics) {
    throw new BadRequestException('Invalid logistics person');
  }

  const mappedClients = await this.logisticsClientMapRepository.find({
    where: {
      logistics_id: { id: dto.logisticsId },
    },
    relations: {
      client_id: true,
    },
  });

  const mappedClientIds = mappedClients.map((item) => item.client_id.id);

  const vials = await this.vialMasterRepository.find({
    where: { is_active: true },
  });

  const activeVialIds = vials.map((item) => item.id);

  for (const item of dto.items) {
    if (!mappedClientIds.includes(item.clientId)) {
      throw new BadRequestException(
        `Client ${item.clientId} is not mapped with selected logistics person`,
      );
    }

    if (!activeVialIds.includes(item.vialId)) {
      throw new BadRequestException(`Vial ${item.vialId} is invalid or inactive`);
    }
  }

  try {
    return await this.dataSource.transaction(async (manager) => {
      const entry = manager.create(LogisticsEntry, {
        logistics_id: logistics,
        entry_date: dto.entryDate,
        submitted_at: new Date(),
        created_by: null,
      });

      const savedEntry = await manager.save(LogisticsEntry, entry);

      const detailRows = dto.items
        .filter((item) => item.qty > 0)
        .map((item) =>
          manager.create(LogisticsEntryDetail, {
            entry_id: savedEntry,
            client_id: { id: item.clientId } as ClientMaster,
            vial_id: { id: item.vialId } as any,
            qty: item.qty,
          }),
        );

      if (detailRows.length > 0) {
        await manager.save(LogisticsEntryDetail, detailRows);
      }

      return {
        status: 1,
        message: 'Logistics entry saved successfully',
        data: {
          entryId: savedEntry.id,
        },
      };
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new BadRequestException(
        'Entry already submitted for this logistics person on selected date',
      );
    }

    throw error;
  }
}

async getLogisticsEntryList(query: LogisticsEntryFilterDto) {
  const qb = this.logisticsEntryDetailRepository
    .createQueryBuilder('detail')
    .leftJoin('detail.entry_id', 'entry')
    .leftJoin('entry.logistics_id', 'logistics')
    .leftJoin('detail.client_id', 'client')
    .leftJoin('detail.vial_id', 'vial')
    .select([
      'entry.id AS entry_id',
      'entry.entry_date AS entry_date',
      'entry.submitted_at AS submitted_at',
      'logistics.id AS logistics_id',
      'logistics.name AS logistics_name',
      'logistics.code AS logistics_code',
      'client.id AS client_id',
      'client.client_name AS client_name',
      'client.client_code AS client_code',
      'vial.id AS vial_id',
      'vial.vial_name AS vial_name',
      'detail.qty AS qty',
    ])
    .orderBy('entry.id', 'DESC')
    .addOrderBy('client.client_name', 'ASC')
    .addOrderBy('vial.display_order', 'ASC');

  if (query.logisticsId) {
    qb.andWhere('entry.logistics_id = :logisticsId', {
      logisticsId: query.logisticsId,
    });
  }

  if (query.entryDate) {
    qb.andWhere('entry.entry_date = :entryDate', {
      entryDate: query.entryDate,
    });
  }

  const rows = await qb.getRawMany();

  const grouped = rows.reduce((acc, row) => {
    const entryId = row.entry_id;

    if (!acc[entryId]) {
      acc[entryId] = {
        entryId: row.entry_id,
        entryDate: row.entry_date,
        submittedAt: row.submitted_at,
        logistics: {
          id: row.logistics_id,
          name: row.logistics_name,
          code: row.logistics_code,
        },
        items: [],
      };
    }

    acc[entryId].items.push({
      clientId: row.client_id,
      clientName: row.client_name,
      clientCode: row.client_code,
      vialId: row.vial_id,
      vialName: row.vial_name,
      qty: Number(row.qty),
    });

    return acc;
  }, {});

  return {
    status: 1,
    message: 'Logistics entry list fetched successfully',
    data: Object.values(grouped),
  };
}

async getLogisticsEntryExportData(query: LogisticsEntryFilterDto) {
  const qb = this.logisticsEntryDetailRepository
    .createQueryBuilder('detail')
    .leftJoin('detail.entry_id', 'entry')
    .leftJoin('entry.logistics_id', 'logistics')
    .leftJoin('detail.client_id', 'client')
    .leftJoin('detail.vial_id', 'vial')
    .select([
      'entry.id AS entry_id',
      'entry.entry_date AS entry_date',
      'entry.submitted_at AS submitted_at',
      'logistics.id AS logistics_id',
      'logistics.name AS logistics_name',
      'logistics.code AS logistics_code',
      'client.id AS client_id',
      'client.client_name AS client_name',
      'client.client_code AS client_code',
      'vial.id AS vial_id',
      'vial.vial_name AS vial_name',
      'detail.qty AS qty',
    ])
    .orderBy('entry.id', 'DESC');

  if (query.logisticsId) {
    qb.andWhere('entry.logistics_id = :logisticsId', {
      logisticsId: query.logisticsId,
    });
  }

  if (query.entryDate) {
    qb.andWhere('entry.entry_date = :entryDate', {
      entryDate: query.entryDate,
    });
  }

  return qb.getRawMany();
}

async getLogisticsEntrySummary(query: LogisticsEntryFilterDto) {
  const qb = this.logisticsEntryDetailRepository
    .createQueryBuilder('detail')
    .leftJoin('detail.entry_id', 'entry')
    .leftJoin('entry.logistics_id', 'logistics')
    .leftJoin('detail.client_id', 'client')
    .select([
      'entry.id AS entry_id',
      'entry.entry_date AS entry_date',
      'entry.submitted_at AS submitted_at',
      'logistics.id AS logistics_id',
      'logistics.name AS logistics_name',
      'logistics.code AS logistics_code',
      'COUNT(DISTINCT client.id) AS total_clients',
      'COALESCE(SUM(detail.qty), 0) AS total_vials',
    ])
    .groupBy('entry.id')
    .addGroupBy('entry.entry_date')
    .addGroupBy('entry.submitted_at')
    .addGroupBy('logistics.id')
    .addGroupBy('logistics.name')
    .addGroupBy('logistics.code')
    .orderBy('entry.id', 'DESC');

  if (query.logisticsId) {
    qb.andWhere('entry.logistics_id = :logisticsId', {
      logisticsId: query.logisticsId,
    });
  }

  if (query.entryDate) {
    qb.andWhere('entry.entry_date = :entryDate', {
      entryDate: query.entryDate,
    });
  }

  const rows = await qb.getRawMany();

  return {
    status: 1,
    message: 'Logistics entry summary fetched successfully',
    data: rows.map((row) => ({
      entryId: Number(row.entry_id),
      entryDate: row.entry_date,
      submittedAt: row.submitted_at,
      logistics: {
        id: Number(row.logistics_id),
        name: row.logistics_name,
        code: row.logistics_code,
      },
      totalClients: Number(row.total_clients),
      totalVials: Number(row.total_vials),
    })),
  };
}

async getLogisticsEntryById(entryId: number) {
  const rows = await this.logisticsEntryDetailRepository
    .createQueryBuilder('detail')
    .leftJoin('detail.entry_id', 'entry')
    .leftJoin('entry.logistics_id', 'logistics')
    .leftJoin('detail.client_id', 'client')
    .leftJoin('detail.vial_id', 'vial')
    .select([
      'entry.id AS entry_id',
      'entry.entry_date AS entry_date',
      'entry.submitted_at AS submitted_at',
      'logistics.id AS logistics_id',
      'logistics.name AS logistics_name',
      'logistics.code AS logistics_code',
      'client.id AS client_id',
      'client.client_name AS client_name',
      'client.client_code AS client_code',
      'vial.id AS vial_id',
      'vial.vial_name AS vial_name',
      'detail.qty AS qty',
    ])
    .where('entry.id = :entryId', { entryId })
    .orderBy('client.client_name', 'ASC')
    .addOrderBy('vial.id', 'ASC')
    .getRawMany();

  if (!rows.length) {
    throw new NotFoundException('Logistics entry not found');
  }

  const firstRow = rows[0];

  return {
    status: 1,
    message: 'Logistics entry details fetched successfully',
    data: {
      entryId: Number(firstRow.entry_id),
      entryDate: firstRow.entry_date,
      submittedAt: firstRow.submitted_at,
      logistics: {
        id: Number(firstRow.logistics_id),
        name: firstRow.logistics_name,
        code: firstRow.logistics_code,
      },
      items: rows.map((row) => ({
        clientId: Number(row.client_id),
        clientName: row.client_name,
        clientCode: row.client_code,
        vialId: Number(row.vial_id),
        vialName: row.vial_name,
        qty: Number(row.qty),
      })),
    },
  };
}

async updateLogisticsEntry(entryId: number, dto: UpdateLogisticsEntryDto) {
  const existingEntry = await this.logisticsEntryRepository.findOne({
    where: { id: entryId as any },
    relations: {
      logistics_id: true,
    },
  });

  if (!existingEntry) {
    throw new NotFoundException('Logistics entry not found');
  }

  const today = new Date();
  const entryDateObj = new Date(dto.entryDate);

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const entryOnly = new Date(
    entryDateObj.getFullYear(),
    entryDateObj.getMonth(),
    entryDateObj.getDate(),
  );

  if (entryOnly > todayOnly) {
    throw new BadRequestException('Future date is not allowed');
  }

  const logistics = await this.logisticsPersonRepository.findOne({
    where: {
      id: dto.logisticsId,
      is_active: true,
    },
  });

  if (!logistics) {
    throw new BadRequestException('Invalid logistics person');
  }

  const duplicateEntry = await this.logisticsEntryRepository
    .createQueryBuilder('entry')
    .where('entry.id != :entryId', { entryId })
    .andWhere('entry.logistics_id = :logisticsId', { logisticsId: dto.logisticsId })
    .andWhere('entry.entry_date = :entryDate', { entryDate: dto.entryDate })
    .getOne();

  if (duplicateEntry) {
    throw new BadRequestException(
      'Another entry already exists for this logistics person on selected date',
    );
  }

  const mappedClients = await this.logisticsClientMapRepository.find({
    where: {
      logistics_id: { id: dto.logisticsId },
    },
    relations: {
      client_id: true,
    },
  });

  const mappedClientIds = mappedClients.map((item) => item.client_id.id);

  const vials = await this.vialMasterRepository.find({
    where: { is_active: true },
  });

  const activeVialIds = vials.map((item) => item.id);

  for (const item of dto.items) {
    if (!mappedClientIds.includes(item.clientId)) {
      throw new BadRequestException(
        `Client ${item.clientId} is not mapped with selected logistics person`,
      );
    }

    if (!activeVialIds.includes(item.vialId)) {
      throw new BadRequestException(`Vial ${item.vialId} is invalid or inactive`);
    }
  }

  try {
    return await this.dataSource.transaction(async (manager) => {
      await manager.update(
        LogisticsEntry,
        { id: entryId as any },
        {
          logistics_id: logistics,
          entry_date: dto.entryDate,
          submitted_at: new Date(),
        },
      );

      await manager.delete(LogisticsEntryDetail, {
        entry_id: { id: entryId } as any,
      });

      const detailRows = dto.items
        .filter((item) => item.qty > 0)
        .map((item) =>
          manager.create(LogisticsEntryDetail, {
            entry_id: { id: entryId } as any,
            client_id: { id: item.clientId } as ClientMaster,
            vial_id: { id: item.vialId } as any,
            qty: item.qty,
          }),
        );

      if (detailRows.length > 0) {
        await manager.save(LogisticsEntryDetail, detailRows);
      }

      return {
        status: 1,
        message: 'Logistics entry updated successfully',
        data: {
          entryId,
        },
      };
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new BadRequestException(
        'Another entry already exists for this logistics person on selected date',
      );
    }

    throw error;
  }
}

async createLogisticsClientMap(dto: CreateLogisticsClientMapDto) {
  const logistics = await this.logisticsPersonRepository.findOne({
    where: {
      id: dto.logisticsId,
      is_active: true,
    },
  });

  if (!logistics) {
    throw new BadRequestException('Invalid logistics person');
  }

  const client = await this.clientMasterRepository.findOne({
    where: {
      id: dto.clientId,
      is_active: true,
    },
  });

  if (!client) {
    throw new BadRequestException('Invalid client');
  }

  const existingMap = await this.logisticsClientMapRepository.findOne({
    where: {
      logistics_id: { id: dto.logisticsId },
      client_id: { id: dto.clientId },
    },
  });

  if (existingMap) {
    throw new BadRequestException('This client is already mapped with selected logistics person');
  }

  const mapRow = this.logisticsClientMapRepository.create({
    logistics_id: logistics,
    client_id: client,
  });

  const saved = await this.logisticsClientMapRepository.save(mapRow);

  return {
    status: 1,
    message: 'Logistics-client mapping created successfully',
    data: saved,
  };
}

async deleteLogisticsClientMap(id: number) {
  const existingMap = await this.logisticsClientMapRepository.findOne({
    where: { id },
  });

  if (!existingMap) {
    throw new NotFoundException('Logistics-client mapping not found');
  }

  await this.logisticsClientMapRepository.delete({ id });

  return {
    status: 1,
    message: 'Logistics-client mapping deleted successfully',
  };
}

async getLogisticsClientMapList() {
  const data = await this.logisticsClientMapRepository.find({
    relations: {
      logistics_id: true,
      client_id: true,
    },
    order: {
      id: 'DESC',
    },
  });

  return {
    status: 1,
    message: 'Logistics-client mapping list fetched successfully',
    data: data.map((item) => ({
      id: item.id,
      logistics: {
        id: item.logistics_id.id,
        name: item.logistics_id.name,
        code: item.logistics_id.code,
      },
      client: {
        id: item.client_id.id,
        client_name: item.client_id.client_name,
        client_code: item.client_id.client_code,
      },
      created_at: item.created_at,
    })),
  };
}

async getDashboardCounts() {
  const today = new Date().toISOString().split('T')[0];

  const [
    totalLogistics,
    totalClients,
    totalMappings,
    totalEntries,
    todayEntries,
  ] = await Promise.all([
    this.logisticsPersonRepository.count({
      where: { is_active: true },
    }),
    this.clientMasterRepository.count({
      where: { is_active: true },
    }),
    this.logisticsClientMapRepository.count(),
    this.logisticsEntryRepository.count(),
    this.logisticsEntryRepository.count({
      where: { entry_date: today },
    }),
  ]);

  return {
    status: 1,
    message: 'Dashboard counts fetched successfully',
    data: {
      totalLogistics,
      totalClients,
      totalMappings,
      totalEntries,
      todayEntries,
    },
  };
}

async getLogisticsEntryForEdit(entryId: number) {
  const rows = await this.logisticsEntryDetailRepository
    .createQueryBuilder('detail')
    .leftJoin('detail.entry_id', 'entry')
    .leftJoin('entry.logistics_id', 'logistics')
    .leftJoin('detail.client_id', 'client')
    .leftJoin('detail.vial_id', 'vial')
    .select([
      'entry.id AS entry_id',
      'entry.entry_date AS entry_date',
      'entry.submitted_at AS submitted_at',
      'logistics.id AS logistics_id',
      'logistics.name AS logistics_name',
      'logistics.code AS logistics_code',
      'client.id AS client_id',
      'client.client_name AS client_name',
      'client.client_code AS client_code',
      'vial.id AS vial_id',
      'vial.vial_name AS vial_name',
      'detail.qty AS qty',
    ])
    .where('entry.id = :entryId', { entryId })
    .orderBy('client.client_name', 'ASC')
    .addOrderBy('vial.id', 'ASC')
    .getRawMany();

  if (!rows.length) {
    throw new NotFoundException('Logistics entry not found');
  }

  const firstRow = rows[0];

  const matrix = rows.reduce((acc, row) => {
    const clientId = Number(row.client_id);
    const vialId = Number(row.vial_id);

    if (!acc[clientId]) {
      acc[clientId] = {
        clientId,
        clientName: row.client_name,
        clientCode: row.client_code,
        vials: {},
      };
    }

    acc[clientId].vials[vialId] = Number(row.qty);
    return acc;
  }, {});

  return {
    status: 1,
    message: 'Logistics entry edit data fetched successfully',
    data: {
      entryId: Number(firstRow.entry_id),
      logisticsId: Number(firstRow.logistics_id),
      logisticsName: firstRow.logistics_name,
      logisticsCode: firstRow.logistics_code,
      entryDate: firstRow.entry_date,
      submittedAt: firstRow.submitted_at,
      items: rows.map((row) => ({
        clientId: Number(row.client_id),
        clientName: row.client_name,
        clientCode: row.client_code,
        vialId: Number(row.vial_id),
        vialName: row.vial_name,
        qty: Number(row.qty),
      })),
      matrix: Object.values(matrix),
    },
  };
}
}