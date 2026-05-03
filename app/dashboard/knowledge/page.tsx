import { FileText, Globe2, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ManualSourceForm } from "@/components/knowledge/manual-source-form";
import { SourceActions } from "@/components/knowledge/source-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getKnowledgeSources, getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function KnowledgePage() {
  const workspace = await getWorkspaceOrRedirect();
  const sources = await getKnowledgeSources(workspace);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>RAG knowledge base</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Knowledge</h1>
          <p className="mt-2 text-harlo-muted">Add website pages and files that Harlo can retrieve before answering visitors.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary"><Globe2 size={16} /> Add URL</Button>
          <Button><Plus size={16} /> Upload file</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-harlo-ink">Add manual knowledge</h2>
          <p className="text-sm text-harlo-muted">Paste trusted business information and Harlo will chunk, embed, and store it for retrieval.</p>
        </CardHeader>
        <CardBody>
          <ManualSourceForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-harlo-ink">Sources</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {sources.length === 0 ? (
            <EmptyState
              icon={Globe2}
              title="Add your first source"
              body="Start with the business website. Harlo will crawl, chunk, and embed the content in the next ingestion step."
            />
          ) : sources.map((source) => (
            <div key={source.id} className="grid gap-4 rounded-lg border border-harlo-line bg-white p-4 md:grid-cols-[1fr_130px_120px_170px] md:items-center">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  {source.source_type === "file" ? <FileText size={18} /> : <Globe2 size={18} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-harlo-ink">{source.name}</p>
                  <p className="text-xs text-harlo-muted">{formatSourceType(source.source_type)}</p>
                </div>
              </div>
              <span className="text-sm text-harlo-muted">
                {typeof source.metadata.chunk_count === "number" ? `${source.metadata.chunk_count} chunks` : new Date(source.created_at).toLocaleDateString()}
              </span>
              <Badge className="w-fit capitalize">{formatStatus(source.status)}</Badge>
              <SourceActions source={source} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function formatSourceType(sourceType: string) {
  return sourceType === "url" ? "URL" : capitalize(sourceType);
}

function formatStatus(status: string) {
  return capitalize(status);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
