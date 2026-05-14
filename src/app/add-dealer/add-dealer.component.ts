import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DealerService, Dealer } from '../dealer.service';

@Component({
  selector: 'app-add-dealer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dealer.component.html',
  styleUrls: ['./add-dealer.component.css']
})
export class AddDealerComponent {

  dealer: Dealer = {
    dealerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    status: 'ACTIVE',
    password: ''
  };

  loading = false;
  toast = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private dealerService: DealerService, private router: Router) {}

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  addDealer(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.dealerService.create(this.dealer).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Dealer created successfully!', 'success');
        this.resetForm(form);
        setTimeout(() => this.router.navigate(['/view-dealers']), 1500);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.showToast('Failed to create dealer. Please try again.', 'error');
      }
    });
  }

  resetForm(form?: NgForm) {
    this.dealer = {
      dealerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      status: 'ACTIVE',
      password: ''
    };
    form?.resetForm(this.dealer);
  }
}
