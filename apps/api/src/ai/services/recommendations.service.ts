import { Injectable } from '@nestjs/common';
import { AiService } from '../ai.service';

interface UserContext {
  interests: string[];
  recentlyViewed: string[];
  purchaseHistory: string[];
}

interface Product {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  price: number;
  condition: string;
}

interface RecommendationResult {
  productIds: string[];
  reasoning: string;
}

@Injectable()
export class RecommendationsService {
  constructor(private aiService: AiService) {}

  async getPersonalizedRecommendations(
    userContext: UserContext,
    availableProducts: Product[],
    limit: number = 10,
  ): Promise<RecommendationResult> {
    if (!this.aiService.isConfigured()) {
      // Fallback: return random products
      const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
      return {
        productIds: shuffled.slice(0, limit).map((p) => p.id),
        reasoning: 'AI not configured - showing random products',
      };
    }

    const systemPrompt = `You are a product recommendation engine for an online marketplace in Zambia.
Your job is to analyze user preferences and recommend the most relevant products.

Consider the following factors when making recommendations:
1. User's stated interests (category preferences)
2. Recently viewed products (indicates current shopping intent)
3. Purchase history (indicates past preferences and budget range)
4. Product variety (don't recommend too many similar items)
5. Price range consistency with past purchases

Return a JSON object with:
- productIds: array of recommended product IDs (up to ${limit})
- reasoning: brief explanation of why these products were chosen`;

    const userMessage = `User Context:
- Interests: ${userContext.interests.join(', ') || 'Not specified'}
- Recently Viewed Categories: ${userContext.recentlyViewed.join(', ') || 'None'}
- Past Purchase Categories: ${userContext.purchaseHistory.join(', ') || 'None'}

Available Products:
${availableProducts
  .slice(0, 50) // Limit to 50 products for context
  .map(
    (p) =>
      `- ID: ${p.id}, Title: "${p.title}", Category: ${p.category}${p.subcategory ? '/' + p.subcategory : ''}, Price: K${p.price}, Condition: ${p.condition}`,
  )
  .join('\n')}

Select up to ${limit} products that would be most relevant for this user.`;

    try {
      const result = await this.aiService.generateJson<RecommendationResult>(
        systemPrompt,
        userMessage,
        { temperature: 0.7 },
      );

      // Validate that returned IDs exist in available products
      const validIds = new Set(availableProducts.map((p) => p.id));
      const validatedIds = result.productIds.filter((id) => validIds.has(id));

      return {
        productIds: validatedIds.slice(0, limit),
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error('AI recommendation failed:', error);
      // Fallback to random
      const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
      return {
        productIds: shuffled.slice(0, limit).map((p) => p.id),
        reasoning: 'Fallback recommendations due to AI error',
      };
    }
  }

  async getSimilarProducts(
    product: Product,
    availableProducts: Product[],
    limit: number = 5,
  ): Promise<string[]> {
    if (!this.aiService.isConfigured()) {
      // Fallback: return products from same category
      return availableProducts
        .filter((p) => p.id !== product.id && p.category === product.category)
        .slice(0, limit)
        .map((p) => p.id);
    }

    const systemPrompt = `You are a product similarity engine. Given a product, find the most similar products from the available list.
Consider: category, subcategory, price range, condition, and what a buyer of the original product might also be interested in.
Return ONLY a JSON array of product IDs, nothing else.`;

    const userMessage = `Original Product:
- Title: "${product.title}"
- Category: ${product.category}${product.subcategory ? '/' + product.subcategory : ''}
- Price: K${product.price}
- Condition: ${product.condition}

Available Products:
${availableProducts
  .filter((p) => p.id !== product.id)
  .slice(0, 30)
  .map(
    (p) =>
      `- ID: ${p.id}, Title: "${p.title}", Category: ${p.category}, Price: K${p.price}`,
  )
  .join('\n')}

Return ${limit} most similar product IDs as a JSON array.`;

    try {
      const result = await this.aiService.generateJson<string[]>(
        systemPrompt,
        userMessage,
        { temperature: 0.5 },
      );

      const validIds = new Set(availableProducts.map((p) => p.id));
      return result.filter((id) => validIds.has(id)).slice(0, limit);
    } catch {
      // Fallback
      return availableProducts
        .filter((p) => p.id !== product.id && p.category === product.category)
        .slice(0, limit)
        .map((p) => p.id);
    }
  }
}
