import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientMasterDto } from 'src/dto/create-client-master.dto';
import { ClientMaster } from 'src/logistics/entities/client-master.entity';
import { Repository, Not } from 'typeorm';
import { UpdateClientMasterDto } from './update-client-master.dto';


@Injectable()
export class ClientMasterService {
  constructor(
    @InjectRepository(ClientMaster)
    private readonly clientRepo: Repository<ClientMaster>,
  ) {}

  async create(createDto: CreateClientMasterDto) {
    if (createDto.client_code) {
      const existingCode = await this.clientRepo.findOne({
        where: { client_code: createDto.client_code },
      });

      if (existingCode) {
        throw new BadRequestException('Client code already exists');
      }
    }

    const client = this.clientRepo.create({
      client_name: createDto.client_name,
      client_code: createDto.client_code || null,
      is_active: createDto.is_active ?? true,
    });

    const savedClient = await this.clientRepo.save(client);

    return {
      status: 1,
      message: 'Client created successfully',
      data: savedClient,
    };
  }

  async findAll() {
    const clients = await this.clientRepo.find({
      order: { id: 'DESC' },
    });

    return {
      status: 1,
      message: 'Client list fetched successfully',
      data: clients,
    };
  }

  async findOne(id: number) {
    const client = await this.clientRepo.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return {
      status: 1,
      message: 'Client details fetched successfully',
      data: client,
    };
  }

  async update(id: number, updateDto: UpdateClientMasterDto) {
    const client = await this.clientRepo.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (updateDto.client_code) {
      const existingCode = await this.clientRepo.findOne({
        where: {
          client_code: updateDto.client_code,
          id: Not(id),
        },
      });

      if (existingCode) {
        throw new BadRequestException('Client code already exists');
      }
    }

    Object.assign(client, {
      ...updateDto,
      client_code:
        updateDto.client_code !== undefined
          ? updateDto.client_code || null
          : client.client_code,
    });

    const updatedClient = await this.clientRepo.save(client);

    return {
      status: 1,
      message: 'Client updated successfully',
      data: updatedClient,
    };
  }

  async remove(id: number) {
    const client = await this.clientRepo.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.clientRepo.remove(client);

    return {
      status: 1,
      message: 'Client deleted successfully',
      data: null,
    };
  }
}