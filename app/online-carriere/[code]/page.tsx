import OnlineCarriereLobby from "./OnlineCarriereLobby";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <OnlineCarriereLobby code={code.toUpperCase()} />;
}
