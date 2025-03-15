import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Attribution } from "./attribution";
import { ArraySortPipe } from "../../shared/pipes/array-sort.pipe";

@Component({
  selector: "fuzzy-waddle-attribution",
  imports: [CommonModule, ArraySortPipe],
  templateUrl: "./attribution.component.html"
})
export class AttributionComponent implements OnInit {
  attributions$?: Observable<Attribution[]>;
  private readonly httpClient = inject(HttpClient);
  constructor() {}

  ngOnInit(): void {
    this.attributions$ = this.httpClient.get<Attribution[]>("assets/general/attributions.json");
  }
}
