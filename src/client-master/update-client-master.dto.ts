import { PartialType } from "@nestjs/mapped-types";
import { CreateClientMasterDto } from "src/dto/create-client-master.dto";



export class UpdateClientMasterDto extends PartialType(CreateClientMasterDto) {}