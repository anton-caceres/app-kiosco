from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(model_name='customer', name='credit_limit'),
        migrations.RemoveField(model_name='customer', name='allow_over_limit'),
    ]
