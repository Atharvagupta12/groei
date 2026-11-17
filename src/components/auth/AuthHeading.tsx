export default function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="text-32 font-extrabold tracking-tight text-white-1">{title}</h1>
      <p className="text-16 text-white-2">{subtitle}</p>
    </div>
  );
}
