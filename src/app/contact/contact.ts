import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
 selector: 'app-contact',
 standalone: true,
 imports: [FormsModule, CommonModule],
 templateUrl: './contact.html',
 styleUrls: ['./contact.css']
})
export class ContactComponent {}