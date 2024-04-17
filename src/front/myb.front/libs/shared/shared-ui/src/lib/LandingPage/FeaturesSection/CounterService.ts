import { Injectable } from '@angular/core';
import { Counter } from './Counter';
import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
@Injectable({
  providedIn: 'root', // This makes the service globally available
})
export class CounterService {
  private readonly _counter = new BehaviorSubject<Counter>(new Counter());

  public counter$ = this._counter.asObservable();

  increment() {
    var oldValue = this._counter.getValue();
    var newValue = new Counter();
    newValue.count = oldValue.count;
    newValue.count++;
    this._counter.next(newValue);
  }
  counterValueChanges() {
    return this.counter$.pipe(
      filter((value) => value.count === 3),
      take(1) // Ensures it completes after the first emission that passes the filter
    );
  }
}
