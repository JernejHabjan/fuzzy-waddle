import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProbableWaffleMapEnum, ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "probable-waffle-map-filter",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./map-filter.component.html",
  styleUrls: ["./map-filter.component.scss"]
})
export class MapFilterComponent implements OnInit {
  @Output() filter = new EventEmitter<ProbableWaffleMapEnum[]>();
  protected checkedMaps: { id: number; name: string; checked: boolean }[] = [];

  ngOnInit(): void {
    this.checkedMaps = Object.values(ProbableWaffleLevels).map((m) => ({
      id: m.id,
      name: m.name,
      checked: true
    }));
  }

  protected onLevelChange($event: Event, level: ProbableWaffleMapEnum) {
    const isChecked = ($event.target as HTMLInputElement).checked;
    const checkedLevelObject = this.checkedMaps.find((m) => m.id === level);
    checkedLevelObject!.checked = isChecked;
    this.filter.emit(this.checkedMaps.filter((m) => m.checked).map((m) => m.id));
  }
}
