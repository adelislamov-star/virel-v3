export const dynamic = 'force-dynamic';

export default function DistrictPage({ params }: { params: { district: string } }) {
  return (
    <div>
      <h1>Escorts in {params.district}</h1>
      <p>Coming soon.</p>
    </div>
  );
}
