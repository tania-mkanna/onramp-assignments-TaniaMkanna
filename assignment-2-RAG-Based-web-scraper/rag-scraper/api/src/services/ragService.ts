import { answerQuestionWithRAG } from "../../../rag/src/qaEngine.js";
import { TOPICS, type TopicKey } from "../config/topics.js";

export async function askQuestion(topicKey: TopicKey, question: string) {
  const topic = TOPICS[topicKey];
  if (!topic.domain) {
    throw new Error(`Topic "${topicKey}" is not available yet.`);
  }
  return answerQuestionWithRAG(question, { domain: topic.domain, topK: 3 });
}