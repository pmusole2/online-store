import { IsArray, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetRecommendationsDto {
  @ApiProperty({ description: 'User ID from Convex' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Maximum number of recommendations', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class GetSimilarProductsDto {
  @ApiProperty({ description: 'Product ID to find similar products for' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Maximum number of similar products', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class RecommendationsResponseDto {
  @ApiProperty({ description: 'Array of recommended product IDs' })
  productIds: string[];

  @ApiProperty({ description: 'Reasoning for recommendations' })
  reasoning: string;
}
