import { HashLocationStrategy, LocationStrategy, CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgInviewModule } from 'angular-inport';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JsonBeautyPipe } from './app.pipes';
import { IndividualComponent } from './pages/individual.component';
import { SimpleComponent } from './pages/simple.component';
import { BenchmarkComponent } from './pages/benchmark.component';

@NgModule({
	declarations: [AppComponent, SimpleComponent, JsonBeautyPipe, BenchmarkComponent],
	imports: [BrowserModule, CommonModule, RouterModule, AppRoutingModule, NgInviewModule],
	providers: [Location, { provide: LocationStrategy, useClass: HashLocationStrategy }],
	bootstrap: [AppComponent],
})
export class AppModule {}
