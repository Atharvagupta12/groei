import React from "react";
import { GeneratePodcastProps } from "../../../types";
import { Label } from "./label";
import { Textarea } from "./textarea";

const GeneratePodcast = ({
  setAudioStorageId,
  setAudio,
  voiceType,
  audio,
  voicePrompt,
  setVoicePrompt,
  setAudioDuration,
}: GeneratePodcastProps) => {
  return (
    <div>
      <div className="flex flex-col gap-2.5">
        <Label className="text-16 font-bold text-white-1">
          AI prompt to generate podcast
        </Label>
        <Textarea
        className="input-class font-light focus-visible:ring-offset-violet-300"
        placeholder="Provide text to generate podcast"
        rows={5}
        value={voicePrompt}
        onChange={(e) => setVoicePrompt(e.target.value)}
        /> 
      </div>
    </div>
  );
};

export default GeneratePodcast;
