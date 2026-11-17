export default function Home() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const src = `/midtalk-ui.html?api=${encodeURIComponent(api)}`;
  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden" }}>
      <iframe title="MidTalk collaboration workspace" src={src} style={{ width: "100%", height: "100%", border: 0, display: "block" }} />
    </main>
  );
}
