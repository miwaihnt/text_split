import SentenceSplitter from "@/components/SentenceSplitter";

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-8">
      <SentenceSplitter />
    </div>
  </div>
);

export default HomePage;
