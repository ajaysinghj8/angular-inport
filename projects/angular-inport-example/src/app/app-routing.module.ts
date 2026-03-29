import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndividualComponent } from './pages/individual.component';
import { SimpleComponent } from './pages/simple.component';
import { BenchmarkComponent } from './pages/benchmark.component';

const routes: Routes = [
  { path: 'simple', component: SimpleComponent },
  { path: 'benchmark', component: BenchmarkComponent },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
