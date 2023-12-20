import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProbableWaffleLevelEnum, ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "probable-waffle-map-filter",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./map-filter.component.html",
  styleUrls: ["./map-filter.component.scss"]
})
export class MapFilterComponent implements OnInit {
  @Output() filter = new EventEmitter<ProbableWaffleLevelEnum[]>();
  protected checkedLevels: { id: number; name: string; checked: boolean }[] = [];

  ngOnInit(): void {
    this.checkedLevels = Object.values(ProbableWaffleLevels).map((m) => ({
      id: m.id,
      name: m.name,
      checked: true
    }));
  }

  protected onLevelChange($event: Event, level: ProbableWaffleLevelEnum) {
    const isChecked = ($event.target as HTMLInputElement).checked;
    const checkedLevelObject = this.checkedLevels.find((m) => m.id === level);
    checkedLevelObject!.checked = isChecked;
    this.filter.emit(this.checkedLevels.filter((m) => m.checked).map((m) => m.id));
  }
}
