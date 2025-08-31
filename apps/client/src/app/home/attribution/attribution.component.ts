import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { map, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Attribution } from "./attribution";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";

interface GroupedAttribution {
  type: string;
  items: Attribution[];
}

@Component({
  selector: "fuzzy-waddle-attribution",
  imports: [CommonModule, HomeNavComponent],
  templateUrl: "./attribution.component.html"
})
export class AttributionComponent implements OnInit {
  groupedAttributions$?: Observable<GroupedAttribution[]>;
  private readonly httpClient = inject(HttpClient);

  ngOnInit(): void {
    this.groupedAttributions$ = this.httpClient
      .get<Attribution[]>("assets/general/attributions.json")
      .pipe(map((attributions) => this.groupByType(attributions)));
  }

  private groupByType(attributions: Attribution[]): GroupedAttribution[] {
    const grouped: { [key: string]: Attribution[] } = {};

    for (const attribution of attributions) {
      if (!grouped[attribution.type]) {
        grouped[attribution.type] = [];
      }
      grouped[attribution.type].push(attribution);
    }

    const sortedTypes = Object.keys(grouped).sort();
    return sortedTypes.map((type) => ({
      type,
      items: grouped[type].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }
}
