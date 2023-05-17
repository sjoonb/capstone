import { Controller, Get, Post, Body } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
// import { CanvasState } from './canvas-state.schema';

@Controller('canvas')
export class CanvasController {
  private readonly fileName = 'canvasState.json';
  private tempData: any;

  @Post('save')
  async saveCanvasState(@Body() data: any): Promise<CanvasState> {
    writeFileSync(this.fileName, JSON.stringify(data));
    return;
  }

  @Get('load')
  async loadCanvasState(): Promise<CanvasState[]> {
    if (existsSync(this.fileName)) {
      const data = readFileSync(this.fileName, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  }
}