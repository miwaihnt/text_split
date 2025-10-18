import AdSlot from "@/components/AdSlot";
import SentenceSplitter from "@/components/SentenceSplitter";

const HomePage = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
    <header>
      <AdSlot
        label="Top Banner"
        dimensions="728 × 90"
        className="mx-auto h-[90px] w-full max-w-[728px]"
      />
    </header>
    <SentenceSplitter />
  </div>
);

export default HomePage;
