import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgInviewModule } from '../lib/index';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgInviewModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
