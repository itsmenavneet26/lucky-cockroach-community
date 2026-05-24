import { TopicAdmin } from "@/components/admin/topic-admin";
import { getAllTopics } from "@/lib/queries";

export default async function AdminTopicsPage() {
  const topics = await getAllTopics();
  return <TopicAdmin topics={topics} />;
}
