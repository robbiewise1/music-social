export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  return (
    <div className="p-8">Profile: {params.username} — coming in Milestone 7</div>
  );
}
