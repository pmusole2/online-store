/**
 * Services Index
 * Export all services for easy importing
 */

export {
  apiService,
  ApiServiceError,
  type GetRecommendationsRequest,
  type GetSimilarProductsRequest,
  type RephraseMessageRequest,
  type AnalyzeDisputeRequest,
  type GenerateResolutionMessageRequest,
  type ChatRequest,
  type RecommendationsResponse,
  type RephraseResponse,
  type DisputeAnalysisResponse,
  type ChatResponse,
  type ApiHealthResponse,
} from './api';

export {
  paymentService,
  type PaymentMethod,
  type MobileMoneyProvider,
  type TransactionStatus,
  type PaymentInitiationResponse,
  type PaymentStatusResponse,
  type Transaction,
} from './payments';
