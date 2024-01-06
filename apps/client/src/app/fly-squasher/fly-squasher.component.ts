import { Component, inject, OnInit } from "@angular/core";
import { UserInstanceService } from "../home/profile/user-instance.service";
import { CommonModule } from "@angular/common";

@Component({
  templateUrl: "./fly-squasher.component.html",
  styleUrls: ["./fly-squasher.component.scss"],
  standalone: true,
  imports: [CommonModule]
})
export class FlySquasherComponent implements OnInit {
  protected readonly userInstanceService = inject(UserInstanceService);
  ngOnInit(): void {
    this.userInstanceService.setVisitedGame("fly-squasher");
  }
}
