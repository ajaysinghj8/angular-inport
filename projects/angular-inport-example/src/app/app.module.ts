import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgInviewModule } from 'angular-inport';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JsonBeautyPipe } from './app.pipes';
import { IndividualComponent } from './pages/individual.component';
import { SimpleComponent } from './pages/simple.component';
import { BenchmarkComponent } from './pages/benchmark.component';

@NgModule({
	declarations: [AppComponent, SimpleComponent, JsonBeautyPipe, BenchmarkComponent],
	imports: [BrowserModule, AppRoutingModule, NgInviewModule],
	providers: [Location, { provide: LocationStrategy, useClass: HashLocationStrategy }],
	bootstrap: [AppComponent],
})
export class AppModule {}
