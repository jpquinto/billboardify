import Image from "next/image";
import Container from "../ui/container";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";

interface SongHeroProps {
  album_cover_banner: string;
  track_name: string;
  artist_name: string;
  album_name: string;
}

export const SongHero = ({
  album_cover_banner,
  track_name,
  artist_name,
  album_name,
}: SongHeroProps) => {
  return (
    <Container className="relative">
      <Image
        src={album_cover_banner || "/placeholder.png"}
        alt="Image"
        width={1200}
        height={1200}
        className="object-cover w-full h-[400px] opacity-90"
      />
      <div className="absolute bottom-0 left-0 p-10">
        <LiquidGlassContainer className="p-4 bg-white/50 min-w-[300px]">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{track_name}</h1>
              <p className="text-lg font-semibold text-gray-800">
                {artist_name}
              </p>
              <p className="text-md text-gray-700">{album_name}</p>
            </div>
          </div>
        </LiquidGlassContainer>
      </div>
      <div className="absolute top-0 left-0 w-full h-[25px] bg-gradient-to-t from-transparent to-white"></div>
      <div className="absolute bottom-0 left-0 w-full h-[25px] bg-gradient-to-b from-transparent to-white"></div>
      <div className="absolute top-0 left-0 w-[25px] h-full bg-gradient-to-l from-transparent to-white"></div>
      <div className="absolute top-0 right-0 w-[25px] h-full bg-gradient-to-r from-transparent to-white"></div>
    </Container>
  );
};
