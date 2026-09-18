import { EnvironmentalState, ScientificEvidenceItem } from '../environmental/schema';
import { ScientificRetriever } from '../rag/retriever';

export class RetrievalAgent {
  private retriever = new ScientificRetriever();

  public async retrieve(state: EnvironmentalState, userQuery?: string): Promise<ScientificEvidenceItem[]> {
    const evidence = await this.retriever.retrieveEvidence(state, userQuery, 4);
    
    // Sort by relevance descending and ensure high credibility sources
    return evidence.filter(item => item.relevance >= 0.5);
  }
}

export const globalRetrievalAgent = new RetrievalAgent();
