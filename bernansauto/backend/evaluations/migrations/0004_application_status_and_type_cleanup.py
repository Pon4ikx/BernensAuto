from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("evaluations", "0003_carapplication_user_motoapplication_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="carapplication",
            name="status",
            field=models.CharField(
                choices=[
                    ("новая", "Новая"),
                    ("в_работе", "В работе"),
                    ("ожидает_клиента", "Ожидает ответа клиента"),
                    ("выполнена", "Выполнена"),
                    ("отменена", "Отменена"),
                ],
                default="новая",
                max_length=30,
                verbose_name="Статус",
            ),
        ),
        migrations.AddField(
            model_name="motoapplication",
            name="status",
            field=models.CharField(
                choices=[
                    ("новая", "Новая"),
                    ("в_работе", "В работе"),
                    ("ожидает_клиента", "Ожидает ответа клиента"),
                    ("выполнена", "Выполнена"),
                    ("отменена", "Отменена"),
                ],
                default="новая",
                max_length=30,
                verbose_name="Статус",
            ),
        ),
        migrations.AlterField(
            model_name="carapplication",
            name="application_type",
            field=models.CharField(
                choices=[
                    ("обратный_звонок", "Обратный звонок"),
                    ("консультация", "Консультация"),
                    ("трейд-ин", "Trade-in"),
                    ("покупка", "Покупка"),
                ],
                max_length=50,
                verbose_name="Тип заявки",
            ),
        ),
        migrations.AlterField(
            model_name="motoapplication",
            name="application_type",
            field=models.CharField(
                choices=[
                    ("обратный_звонок", "Обратный звонок"),
                    ("консультация", "Консультация"),
                    ("трейд-ин", "Trade-in"),
                    ("покупка", "Покупка"),
                ],
                max_length=50,
                verbose_name="Тип заявки",
            ),
        ),
    ]
