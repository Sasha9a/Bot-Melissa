import { Injectable } from "@nestjs/common";
import { Model, FilterQuery, UpdateQuery, AnyKeys, AnyObject } from "mongoose";
import { FindOptionsModel } from "../models/find.options.model";

@Injectable()
export class BaseService<T> {

  public constructor(private readonly model: Model<T>) {
  }

  public async create(entity: any): Promise<T> {
    const createEntity = new this.model(entity);
    return await createEntity.save() as T;
  }

  public async findAll(filter?: FilterQuery<T>, options?: FindOptionsModel): Promise<T[]> {
    return await this.model.find(filter, options?.projection).populate(options?.populate).limit(options?.limit).skip(options?.skip).exec();
  }

  public async findObject(filter?: FilterQuery<T>, options?: FindOptionsModel): Promise<T> {
    return await this.model.findOne(filter, options?.projection).populate(options?.populate).exec() as T;
  }

  public async findById(id: string, options?: FindOptionsModel): Promise<T> {
    return await this.model.findById(id, options?.projection).populate(options?.populate).exec() as T;
  }

  public async update(id: string, entity: AnyKeys<T> & AnyObject, options?: FindOptionsModel): Promise<T> {
    return await this.model.findOneAndUpdate({ _id: id }, { $set: entity }, { new: true }).populate(options?.populate).exec() as T;
  }

  public async updateCustom(id: string, update: UpdateQuery<T>, options?: FindOptionsModel): Promise<T> {
    return await this.model.findOneAndUpdate({ _id: id }, update, { new: true }).populate(options?.populate).exec() as T;
  }

  public async delete(id: string, options?: FindOptionsModel): Promise<T> {
    return await this.model.findByIdAndDelete(id).populate(options?.populate).exec() as T;
  }

}
