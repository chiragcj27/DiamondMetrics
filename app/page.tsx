import { FileUploader } from "@/components/FileUploader";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center px-4 py-10">
      <FileUploader />
    </main>
  );
}
