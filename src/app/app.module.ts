import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { NgInviewModule } from "angular-inport";
import { AppComponent } from "./app.component";
import { JsonBeautyPipe } from "./app.pipes";

@NgModule({
  declarations: [AppComponent, JsonBeautyPipe],
  imports: [BrowserModule, NgInviewModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
