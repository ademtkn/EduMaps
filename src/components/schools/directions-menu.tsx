"use client";

import { ChevronDown, Navigation } from "lucide-react";
import { useDict } from "@/components/i18n-provider";
import { TrackedLink } from "@/components/seo/tracked-link";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from "@/components/ui/dropdown";
import { googleDirectionsUrl, twoGisDirectionsUrl } from "@/lib/maps";

/** "Get directions" asks which app to use, so each visitor opens the route where they are used to navigating. */
export function DirectionsMenu({ schoolId, lat, lng }: { schoolId: string; lat: number; lng: number }) {
  const dict = useDict();
  const link = "flex w-full items-center gap-2.5";
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button type="button" size="sm"><Navigation />{dict.school.getDirections}<ChevronDown className="size-4" /></Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel className="px-3 py-1.5 text-caption font-semibold text-ink-500">{dict.school.directionsWith}</DropdownLabel>
        <DropdownItem asChild>
          <TrackedLink schoolId={schoolId} kind="directions" href={googleDirectionsUrl(lat, lng)} target="_blank" rel="noopener noreferrer" className={link}>{dict.school.directionsGoogle}</TrackedLink>
        </DropdownItem>
        <DropdownItem asChild>
          <TrackedLink schoolId={schoolId} kind="directions" href={twoGisDirectionsUrl(lat, lng)} target="_blank" rel="noopener noreferrer" className={link}>{dict.school.directions2gis}</TrackedLink>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
