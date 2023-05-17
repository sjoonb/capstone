import { Controller, Get, Post, Body } from '@nestjs/common';
import { CanvasService } from './canvas.service';
// import { CanvasState } from './canvas-state.schema';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasStateService: CanvasService) {}

  private tempData: any;


  @Post('save')
  async saveCanvasState(@Body() data: any): Promise<CanvasState> {
    console.log(data);
    this.tempData = data;
    return this.canvasStateService.saveCanvasState(data);
  }

  @Get('load')
  async loadCanvasState(): Promise<CanvasState[]> {
    if (this.tempData) {
      return this.tempData;
    } else {
      return [];
    }
  }
}