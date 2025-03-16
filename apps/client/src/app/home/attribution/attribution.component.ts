import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Attribution } from "./attribution";

@Component({
  selector: "fuzzy-waddle-attribution",
  imports: [CommonModule],
  templateUrl: "./attribution.component.html"
})
export class AttributionComponent implements OnInit {
  attributions$?: Observable<Attribution[]>;
  private readonly httpClient = inject(HttpClient);
  constructor() {}

  ngOnInit(): void {
    this.attributions$ = this.httpClient.get<Attribution[]>("assets/general/attributions.json");
  }

  groupByType(attributions: Attribution[]): { type: string; items: Attribution[] }[] {
    const grouped: { [key: string]: Attribution[] } = {};

    // Group attributions by type
    for (const attribution of attributions) {
      if (!grouped[attribution.type]) {
        grouped[attribution.type] = [];
      }
      grouped[attribution.type].push(attribution);
    }

    // Sort types alphabetically and within each type, sort by name alphabetically
    const sortedTypes = Object.keys(grouped).sort();
    return sortedTypes.map((type) => ({
      type,
      items: grouped[type].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }
}
