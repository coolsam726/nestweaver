import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Company {
  @Prop({ required: true })
  name!: string;

  @Prop()
  code?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  active!: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
