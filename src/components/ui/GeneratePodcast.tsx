import React, { useState } from "react";
import { GeneratePodcastProps } from "../../../types";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Loader } from "lucide-react";
import { Button } from "./button";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { generateUploadUrl } from "../../../convex/files";
import { useUploadFiles } from "@xixixao/uploadstuff/react";
import { toast, useToast } from "./use-toast";
 
const useGeneratePodcast = ({
  setAudio,
  voiceType,
  voicePrompt,
  setAudioStorageId,
}: GeneratePodcastProps) => {
  // logic for podcast generation

  const [isGenerating, setIsGenerating] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl);
  const getPodcastAudio = useAction(api.openai.generateAudioAction);
  const getAudioUrl = useMutation(api.podcasts.getUrl)

  const generatePodcast = async () => {
    setIsGenerating(true);
    setAudio("");
    if (!voicePrompt) {
      toast({
        title:"Please Provide a VoiceType to generate the podcast"
      })
      return setIsGenerating(false);
    }

    try {
      const response = await getPodcastAudio({
        voice: voiceType,
        input: voicePrompt,
      });

      const blob = new Blob([response], { type: "audio/mpeg" });
      const fileName = `podcast-${uuidv4()}.mp3`;
      const file = new File([blob], fileName, { type: "audio/mpeg" });
      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;
     
      setAudioStorageId(storageId);
      const audioUrl = await getAudioUrl({ storageId })
      setAudio(audioUrl!);
      setIsGenerating(false);
      toast({ 
        title:"Podcast Generated Successfully"
      })
    } catch (error) {
      console.log("error generating podcast", error);
      toast({
        title:"Error generating the podcast",
        variant: "destructive"
      })
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
      generatePodcast,
  };
};

const GeneratePodcast = (props: GeneratePodcastProps) => {
  const { isGenerating, generatePodcast } = useGeneratePodcast(props);

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
          value={props.voicePrompt}
          onChange={(e) => props.setVoicePrompt(e.target.value)}
        />
      </div>
      <div className="mt-5 w-full max-w-[200px]">
        <button
          type="submit"
          className="text-16  bg-violet-600 py-2 px-6 font-bold
              text-white-1 transition-all rounded "
          onClick={generatePodcast}    
        >
          {isGenerating ? (
            <div className="flex justify-center ">
              Generating
              <Loader className="animate-spin ml-4" />
            </div>
          ) : (
            "Generate "
          )}
        </button>
      </div>
      {props.audio && (
        <audio
          controls
          src={props.audio}
          autoPlay
          className="mt-5 "
          onLoadedMetadata={(e) =>
            props.setAudioDuration(e.currentTarget.duration)
          }
        />
      )}
    </div>
  );
};

export default GeneratePodcast;
