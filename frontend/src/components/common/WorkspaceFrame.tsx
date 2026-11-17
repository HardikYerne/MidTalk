"use client";
export default function WorkspaceFrame({ section }: { section?: string }) {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const requested = section ?? "chat";
  return <main style={{ width: "100vw", height: "100dvh", overflow: "hidden" }}><iframe title="Private collaboration workspace" src={`/midtalk-ui.html?api=${encodeURIComponent(api)}&section=${encodeURIComponent(requested)}`} style={{ width: "100%", height: "100%", border: 0, display: "block" }} /></main>;
}
