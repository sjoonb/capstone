import { Injectable } from '@nestjs/common';

@Injectable()
export class CanvasService {
  constructor(
    // @InjectModel(CanvasState.name) private canvasStateModel: Model<CanvasState>,
  ) {}

  async saveCanvasState(data: any): Promise<CanvasState> {
    // const createdCanvasState = new this.canvasStateModel(data);
    // return createdCanvasState.save();
    return;
  }

  async getAllCanvasStates(): Promise<CanvasState[]> {
    // return this.canvasStateModel.find().exec();
    return;
  }
}
