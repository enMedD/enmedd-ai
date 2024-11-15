import { Input } from "@/components/ui/input";
import { containsObject, objectsAreEquivalent } from "@/lib/contains";
import { getValidTags } from "@/lib/tags/tagUtils";
import { Tag } from "@/lib/types";
import { debounce } from "lodash";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TagFilter({
  tags,
  selectedTags,
  setSelectedTags,
}: {
  tags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}) {
  const [filterValue, setFilterValue] = useState("");
  const [tagOptionsAreVisible, setTagOptionsAreVisible] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Tag[]>(tags);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const onSelectTag = (tag: Tag) => {
    setSelectedTags((prev) => {
      if (containsObject(prev, tag)) {
        return prev.filter((t) => !objectsAreEquivalent(t, tag));
      } else {
        return [...prev, tag];
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setTagOptionsAreVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const debouncedFetchTags = useRef(
    debounce(async (value: string) => {
      if (value) {
        const fetchedTags = await getValidTags(value);
        setFilteredTags(fetchedTags);
      } else {
        setFilteredTags(tags);
      }
    }, 50)
  ).current;

  useEffect(() => {
    debouncedFetchTags(filterValue);

    return () => {
      debouncedFetchTags.cancel();
    };
  }, [filterValue, tags, debouncedFetchTags]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Search tags"
          value={filterValue}
          onChange={(event) => setFilterValue(event.target.value)}
          onFocus={() => setTagOptionsAreVisible(true)}
          className="pl-8"
        />
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
        />
      </div>
      {selectedTags.length > 0 && (
        <div className="mt-2">
          <div className="mt-1 flex bg-black flex-wrap gap-x-1 gap-y-1">
            {selectedTags.map((tag) => (
              <div
                key={tag.tag_key + tag.tag_value}
                onClick={() => onSelectTag(tag)}
                className="max-w-full break-all line-clamp-1 text-ellipsis flex text-sm border border-border py-0.5 px-2 rounded cursor-pointer bg-background hover:bg-hover"
              >
                {tag.tag_key}
                <b>=</b>
                {tag.tag_value}
                <X className="my-auto ml-1" />
              </div>
            ))}
          </div>
          <div
            onClick={() => setSelectedTags([])}
            className="pl-0.5 text-xs text-accent cursor-pointer mt-2 w-fit"
          >
            Clear all
          </div>
        </div>
      )}
    </div>
  );
}
