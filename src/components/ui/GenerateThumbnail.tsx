import React, { useRef, useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Loader } from "lucide-react";
import { GenerateThumbnailProps } from "../../../types";
import { Input } from "./input";
import Image from "next/image";

const GenerateThumbnail = ({
  setImage,
  setImageStorageId,
  image,
  imagePrompt,
  setImagePrompt,
}: GenerateThumbnailProps) => {
  const [isAiThumbnail, setIsAiThumbnail] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const generateImage = async () => {};
  return (
    <>
      <div className="generate_thumbnail ">
        <Button
          type="button"
          variant="plain"
          onClick={() => {
            setIsAiThumbnail(true);
          }}
          className={cn("", {
            "bg-black-6": isAiThumbnail,
          })}
        >
          Use Ai to Generate Thumbnail
        </Button>

        <Button
          type="button"
          variant="plain"
          onClick={() => {
            setIsAiThumbnail(false);
          }}
          className={cn("", {
            "bg-black-6": !isAiThumbnail,
          })}
        >
          Upload Custom Image
        </Button>
      </div>
      {isAiThumbnail ? (
        <div className="flex flex-col gap-5">
          <div className="mt-5 flex flex-col gap-2.5">
            <Label className="text-16 font-bold text-white-1">
              AI Prompt to generate Thumbnail
            </Label>
            <Textarea
              className="input-class font-light focus-visible:ring-offset-violet-300"
              placeholder="Provide text to generate podcast"
              rows={5}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
            />
          </div>
          <div className=" w-full max-w-[200px]">
            <Button
              type="submit"
              className="text-16  bg-violet-600 py-2 px-6 font-bold
            text-white-1 transition-all rounded "
              onClick={generateImage}
            >
              {isImageLoading ? (
                <div className="flex justify-center ">
                  Generating
                  <Loader className="animate-spin ml-4" />
                </div>
              ) : (
                "Generate "
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="image_div" onClick={() => imageRef?.current?.click()}>
          <Input type="file" className="hidden" ref={imageRef} />
          {!isImageLoading ? (
            <Image
              src="/icons/upload-image.svg"
              width={40}
              height={40}
              alt="upload"
            />
          ) : (
            <div className="text-16 flex-center font-medium text-white-1">
              Uploading
              <Loader className="animate-spin ml-4" />
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-14 font-bold text-violet-600">Click to upload</h2>
            <p className="text-12 font-normal text-grey-1">SVG, PNG, JPG, OR GIF ( max 1080x1080px )</p>
          </div>
        </div>
      )}
    </>
  );
};

export default GenerateThumbnail;
