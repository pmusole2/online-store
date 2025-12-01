import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RecommendationsService } from './services/recommendations.service';
import { MessageRephraseService } from './services/message-rephrase.service';
import { DisputeAnalysisService } from './services/dispute-analysis.service';
import { ChatService } from './services/chat.service';
import { ConvexModule } from '../convex/convex.module';

@Module({
  imports: [ConvexModule],
  controllers: [AiController],
  providers: [
    AiService,
    RecommendationsService,
    MessageRephraseService,
    DisputeAnalysisService,
    ChatService,
  ],
  exports: [
    AiService,
    RecommendationsService,
    MessageRephraseService,
    DisputeAnalysisService,
    ChatService,
  ],
})
export class AiModule {}
