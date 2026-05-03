import {Composition} from "remotion";
import {HarloMarketingVideo} from "./HarloMarketingVideo";

export const Root = () => {
  return (
    <Composition
      id="HarloMarketing"
      component={HarloMarketingVideo}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
